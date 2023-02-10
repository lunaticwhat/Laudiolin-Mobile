import React from "react";
import { Dimensions, ScrollView, TouchableHighlight, View } from "react-native";

import Hide from "@components/common/Hide";
import BasicText from "@components/common/BasicText";
import MixedText from "@components/common/MixedText";
import BasicModal from "@components/common/BasicModal";
import BasicButton from "@components/common/BasicButton";

import { Image } from "@rneui/base";

import { SettingsPageStyle } from "@styles/PageStyles";

import type { User, SettingType } from "@backend/types";
import * as settings from "@backend/settings";
import { navigate } from "@backend/navigation";
import { getCode, logout, userData } from "@backend/user";
import { connect, connected } from "@backend/gateway";

class Setting extends React.Component<
    { setting: string, type: SettingType, options?: string[] }, { value: string }
> {
    constructor(props: any) {
        super(props);

        this.state = {
            value: ""
        };
    }

    async componentDidMount() {
        this.setState({ value: await settings.getFromPath(
            this.props.setting) ?? "" });
    }

    async showInput() {
        switch(this.props.type) {
            case "select":
                // Get the select options.
                const { options } = this.props;
                if (options == null) return;

                // Get the index of the current select option.
                const index = options.findIndex(option => option == this.state.value);
                if (index == -1) return;
                // Get the next option, or the first option if there is no next option.
                const next = options[index + 1] ?? options[0];
                // Set the next option.
                await settings.saveFromPath(this.props.setting, next);
                this.setState({ value: next });
                return;
        }
    }

    render() {
        return (
            <View style={SettingsPageStyle.configure}>
                <BasicText text={settings.settingsKeys[this.props.setting]}
                           style={SettingsPageStyle.setting} />
                <BasicText text={this.state.value}
                           style={SettingsPageStyle.value}
                           press={() => this.showInput()} />
            </View>
        );
    }
}

interface IState {
    user: User|null;

    code: string;
    showCode: boolean;
    showAuthModal: boolean;
}

class SearchPage extends React.Component<any, IState> {
    constructor(props: any) {
        super(props);

        this.state = {
            user: userData,
            code: "",
            showCode: false,
            showAuthModal: false
        };
    }

    /**
     * Reconnects to the gateway.
     */
    reconnect(): void {
        connect();
    }

    /**
     * Hides the auth code modal.
     */
    hideCodeModal(): void {
        this.setState({
            showAuthModal: false,
            showCode: false, code: ""
        });
    }

    /**
     * Shows the user's auth code.
     */
    async showAuthCode(): Promise<void> {
        this.setState({
            showCode: !this.state.showCode,
            code: !this.state.showCode ? (await getCode() ?? "") : ""
        });
    }

    render() {
        // Pull the user.
        const { user } = this.state;

        return (
            <ScrollView contentContainerStyle={{ paddingLeft: 20, paddingTop: 20 }}>
                <BasicText
                    text={"Settings"}
                    style={SettingsPageStyle.title}
                />

                <View style={SettingsPageStyle.userContainer}>
                    {
                        user != null ? (
                            <>
                                <View style={{ paddingRight: 10 }}>
                                    <Image
                                        style={SettingsPageStyle.userImage}
                                        source={{ uri: user?.avatar ?? "" }}
                                        onLongPress={() => this.setState({ showAuthModal: true })}
                                    />
                                </View>
                                <View style={{ justifyContent: "center" }}>
                                    <BasicText text={"Logged in as"} style={{ fontSize: 13 }} />
                                    <MixedText
                                        first={user?.username ?? ""} second={"#" + (user?.discriminator ?? "0000")}
                                        firstStyle={{ ...SettingsPageStyle.userText, color: "white" }}
                                        secondStyle={{ ...SettingsPageStyle.userText, color: "#888787" }}
                                    />
                                </View>
                                <BasicText
                                    containerStyle={SettingsPageStyle.logOutContainer}
                                    text={"Log out"} style={SettingsPageStyle.logOut}
                                    press={async () => await logout()}
                                />
                            </>
                        ) : (
                            <View style={{ alignItems: "center", width: Dimensions.get("window").width - 20 }}>
                                <BasicButton text={"Log in with Discord"}
                                             color={"#5b67af"} bold={true}
                                             width={200} height={40} radius={10}
                                             transform={"uppercase"}
                                             press={() => navigate("Login")}
                                />
                            </View>
                        )
                    }
                </View>

                <View style={SettingsPageStyle.settingsContainer}>
                    <View style={{ paddingBottom: 20 }}>
                        <BasicText
                            text={"General"}
                            style={SettingsPageStyle.category}
                        />

                        <Setting setting={"search.engine"} type={"select"}
                                 options={["All", "YouTube", "Spotify"]} />
                    </View>
                </View>

                <View style={SettingsPageStyle.actionsContainer}>
                    <Hide show={!connected}>
                        <BasicButton
                            color={"#c75450"}
                            text={"Reconnect to Gateway"}
                            hold={() => this.reconnect()}
                        />
                    </Hide>
                </View>

                <BasicModal
                    title={"Authentication Code"} buttonText={"Close"}
                    showModal={this.state.showAuthModal}
                    onSubmit={() => this.hideCodeModal()}
                    onBackdropPress={() => this.hideCodeModal()}
                >
                    <TouchableHighlight
                        underlayColor={"transparent"}
                        onPress={() => this.showAuthCode()}
                    >
                        <>
                            <BasicText text={`Press to ${this.state.showCode ? "hide" : "show"} code.`} />
                            <Hide show={this.state.showCode}>
                                <BasicText text={`Authentication Code: ${this.state.code}`} />
                            </Hide>
                        </>
                    </TouchableHighlight>
                </BasicModal>
            </ScrollView>
        );
    }
}

export default SearchPage;
